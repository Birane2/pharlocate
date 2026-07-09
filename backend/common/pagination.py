from math import ceil

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_query_param = "page"

    def get_paginated_response(self, data):
        count = self.page.paginator.count
        total_pages = max(1, ceil(count / self.page_size))
        return Response({
            "count": count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "current_page": self.page.number,
            "total_pages": total_pages,
            "results": data,
        })


def paginate_response(queryset, request, serializer_class, context=None):
    """
    Paginates a queryset using StandardResultsSetPagination and returns
    a DRF Response with { count, next, previous, current_page, total_pages, results }.
    """
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)

    if page is not None:
        ctx = context if context is not None else {"request": request}
        serializer = serializer_class(page, many=True, context=ctx)
        return paginator.get_paginated_response(serializer.data)

    # Fallback — queryset did not paginate (empty or unordered edge cases)
    ctx = context if context is not None else {"request": request}
    serializer = serializer_class(queryset, many=True, context=ctx)
    data = serializer.data
    count = len(data)
    return Response({
        "count": count,
        "next": None,
        "previous": None,
        "current_page": 1,
        "total_pages": 1,
        "results": data,
    })
